import { Controller, ParseUUIDPipe, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from './../common';
import { ChangeStatusDto, StatusDto } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(
    @Payload() paginationDto: PaginationDto
  ) {
    return this.ordersService.findAll( paginationDto );
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string ) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('findAllByStatus')
  findAllByStatus(
    @Payload() statusDto: StatusDto,
  ) {
    return this.ordersService.findAllByStatus( statusDto );
  }

  @MessagePattern('changeOrderStatus')
  changeOrderStatus(
    @Payload() changeStatusDto: ChangeStatusDto,
  ) {
    return this.ordersService.changeOrderStatus( changeStatusDto );
  }
}
