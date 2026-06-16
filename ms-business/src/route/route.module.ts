import { Module } from '@nestjs/common';
import { RouteService } from './route.service';
import { RouteController } from './route.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';
import { Node } from '@/node/entities/node.entity';
import { Stop } from '@/stop/entities/stop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Route, Node, Stop])],
  controllers: [RouteController],
  providers: [RouteService],
  exports: [RouteService],
})
export class RouteModule {}
