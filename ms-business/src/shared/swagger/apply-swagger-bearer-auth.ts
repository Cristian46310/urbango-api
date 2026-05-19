import { INestApplication, RequestMethod } from '@nestjs/common';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { OpenAPIObject } from '@nestjs/swagger';
import { IS_PUBLIC_KEY } from '@/auth/decorators/public.decorator';

const HTTP_METHODS: Partial<Record<RequestMethod, string>> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.DELETE]: 'delete',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.OPTIONS]: 'options',
  [RequestMethod.HEAD]: 'head',
  [RequestMethod.SEARCH]: 'search',
};

function normalizePath(...segments: string[]): string {
  const joined = `/${segments.filter(Boolean).join('/')}`.replace(/\/+/g, '/');
  return joined === '' ? '/' : joined.replace(/\/$/, '') || '/';
}

function buildPublicRouteKeys(app: INestApplication): Set<string> {
  const reflector = app.get(Reflector);
  const discovery = app.get(DiscoveryService);
  const scanner = new MetadataScanner();
  const publicKeys = new Set<string>();

  for (const wrapper of discovery.getControllers()) {
    const instance = wrapper.instance as Record<string, unknown> | undefined;
    const metatype = wrapper.metatype as
      | (new (...args: unknown[]) => object)
      | null;
    if (!metatype || !instance) {
      continue;
    }

    const controllerPath = Reflect.getMetadata(PATH_METADATA, metatype) as
      | string
      | undefined;
    const isControllerPublic = reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [metatype],
    );

    const prototype = Object.getPrototypeOf(instance) as object;
    for (const methodName of scanner.getAllMethodNames(prototype)) {
      const handler = instance[methodName];
      if (typeof handler !== 'function') {
        continue;
      }

      const routePath = Reflect.getMetadata(PATH_METADATA, handler) as
        | string
        | undefined;
      const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as
        | RequestMethod
        | undefined;

      if (routePath === undefined || requestMethod === undefined) {
        continue;
      }

      const httpMethod = HTTP_METHODS[requestMethod];
      if (!httpMethod) {
        continue;
      }

      const isPublic =
        isControllerPublic ||
        reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
          handler,
          metatype,
        ]);

      if (!isPublic) {
        continue;
      }

      publicKeys.add(
        `${httpMethod}:${normalizePath(controllerPath ?? '', routePath)}`,
      );
    }
  }

  return publicKeys;
}

export function applySwaggerBearerAuth(
  app: INestApplication,
  document: OpenAPIObject,
  schemeName = 'bearer',
): void {
  const publicRoutes = buildPublicRouteKeys(app);

  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    if (!pathItem) {
      continue;
    }

    for (const [method, operationValue] of Object.entries(pathItem)) {
      if (!operationValue || typeof operationValue !== 'object') {
        continue;
      }

      if (!('responses' in operationValue)) {
        continue;
      }

      const operation = operationValue as {
        responses: Record<string, unknown>;
        security?: Array<Record<string, string[]>>;
      };

      const normalizedPath = path.replace(/\/$/, '') || '/';
      const routeKey = `${method.toLowerCase()}:${normalizedPath}`;

      if (publicRoutes.has(routeKey)) {
        operation.security = [];
        continue;
      }

      operation.security = [{ [schemeName]: [] }];
    }
  }
}
