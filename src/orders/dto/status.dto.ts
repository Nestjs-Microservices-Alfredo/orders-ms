import { IsEnum, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { OrderStatusList } from '../enum';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from './../../common';

export class StatusDto extends PartialType(PaginationDto) {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `status must be a valid enum value: ${OrderStatusList}`,
  })
  status: OrderStatus;
}
