import { Controller, ParseUUIDPipe, UseFilters } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from './../common';
import { ChangeStatusDto, PaidOrderDto, StatusDto } from './dto';

@Controller()
export class OrdersController {
  
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    
    const order = await this.ordersService.create(createOrderDto);

    const paymentSession = await this.ordersService.createPaymentSession(order);

    return {
      order,
      paymentSession
    }
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

  @MessagePattern('change.order.status')
  changeOrderStatus(
    @Payload() changeStatusDto: ChangeStatusDto,
  ) {
    return this.ordersService.changeOrderStatus( changeStatusDto );
  }

  @EventPattern('payment.succeeded')
  paidOrder(
    @Payload() paidOrderDto: PaidOrderDto,
  ) {
    return this.ordersService.paidOrder( paidOrderDto );
  }
}
