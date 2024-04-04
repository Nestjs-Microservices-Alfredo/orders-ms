import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, PrismaClient } from '@prisma/client';
import { PaginationDto } from './../common';
import { RpcException } from '@nestjs/microservices';
import { StatusDto } from './dto/status.dto';
import { ChangeStatusDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(OrdersService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  create( createOrderDto: CreateOrderDto ) {
    return this.order.create({
      data: createOrderDto
    });
  }

  async findAll( paginationDto: PaginationDto ) {
    try {

      const { page, limit } = paginationDto;

      const [ data, totalPages ]: [ Order[], number ] = await Promise.all([
        await this.order.findMany({
          skip: (page - 1) * limit,
          take: limit,
        }),
        await this.order.count(),

      ]);


    const lastPage = Math.ceil(totalPages / limit);

    return {
      data,
      meta: {
        total: totalPages,
        page,
        lastPage 
      }
    }
      
    } catch ( err ) {
      
    }
  }


  async findAllByStatus( statusDto: StatusDto ) {
    try {

      const { page, limit, status } = statusDto;

      const [ data, totalPages ]: [ Order[], number ] = await Promise.all([
        await this.order.findMany({
          skip: (page - 1) * limit,
          take: limit,
          where: { status }
        }),
        await this.order.count(
          {
            where: { status }
          }
        ),

      ]);


    const lastPage = Math.ceil(totalPages / limit);

    return {
      data,
      meta: {
        total: totalPages,
        page,
        lastPage 
      }
    }
      
    } catch ( err ) {
      
    }
  }

  findOne(id: string) {
    
    try {

      const order = this.order.findFirst({
        where: { id}
      });

      if( !order ) throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: `Order id: ${ id } not found` });

      return order;
      
    } catch ( err ) {
      throw new RpcException(err);
    }

  }

  async changeOrderStatus( changeStatusDto: ChangeStatusDto ) {
    try {

      const { id, status } = changeStatusDto;

      const order = await this.findOne(id);

      if( status === order.status ) return order;

      return this.order.update({
        where: { id },
        data: { status }
      });
      
    } catch ( err ) {
      throw new RpcException(err);
    }
  }
}
