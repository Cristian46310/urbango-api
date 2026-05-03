import { Module } from '@nestjs/common';
import { NodeService } from './node.service';
import { NodeController } from './node.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from 'src/route/entities/route.entity';
import { Stop } from 'src/stop/entities/stop.entity';
import { Node } from './entities/node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Node, Route, Stop])],
  controllers: [NodeController],
  providers: [NodeService],
})
export class NodeModule {}
