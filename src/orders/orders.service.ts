import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Order, OrderStatus, PrismaClient } from '@prisma/client';
import { PaginationDto } from './../common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeStatusDto, CreateOrderDto, PaidOrderDto, StatusDto } from './dto';
import { NATS_SERVICE } from './../config';
import { firstValueFrom } from 'rxjs';
import { OrderWithProducts } from './interfaces';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async create(createOrderDto: CreateOrderDto) {

   try {

    const productIds = createOrderDto.items.map((product) => product.productId );

    const products = await firstValueFrom(
      this.client.send(
        { cmd: 'validateProduct' },
        productIds
      ),
    );

    const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
      const price = products.find((product) => product.id === orderItem.productId).price;

      return price * orderItem.quantity;

    }, 0 );

    const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
      return acc * orderItem.quantity;

    }, 0 );

    const order = await this.order.create({
      data: {
        totalAmount,
        totalItems,
        orderItem: {
          createMany: {
            data: createOrderDto.items.map((orderItem) => ({
              quantity: orderItem.quantity,
              productId: orderItem.productId,
              price: products.find((product) => product.id === orderItem.productId).price,
            })),
          },
          }
        },
        include: {
          orderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          },
        }
      });


    return {
      ...order,
      orderItem: order.orderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId).name,
        })
      )
    };
    
   } catch ( err ) {
    throw new RpcException(err);
   }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;

      const [data, totalPages]: [Order[], number] = await Promise.all([
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
          lastPage,
        },
      };
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async findAllByStatus(statusDto: StatusDto) {
    try {
      const { page, limit, status } = statusDto;

      const [data, totalPages]: [Order[], number] = await Promise.all([
        await this.order.findMany({
          skip: (page - 1) * limit,
          take: limit,
          where: { status },
        }),
        await this.order.count({
          where: { status },
        }),
      ]);

      const lastPage = Math.ceil(totalPages / limit);

      return {
        data,
        meta: {
          total: totalPages,
          page,
          lastPage,
        },
      };
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async findOne(id: string) {
    try {
      const order = await this.order.findFirst({
        where: { id },
        include: {
          orderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          },
        },
      });

      if (!order)
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Order id: ${id} not found`,
        });

      const productIds = order.orderItem.map((orderItem) => orderItem.productId);

      const products = await firstValueFrom(
        this.client.send(
          { cmd: 'validateProduct' },
          productIds
        ),
      );

      return {
        ...order,
        orderItem: order.orderItem.map((orderItem) => ({
            ...orderItem,
            name: products.find((product) => product.id === orderItem.productId).name,
          })
        )
      };
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async changeOrderStatus(changeStatusDto: ChangeStatusDto) {
    try {
      const { id, status } = changeStatusDto;

      const order = await this.findOne(id);

      if (status === order.status) return order;

      return this.order.update({
        where: { id },
        data: { status },
      });
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async createPaymentSession( order: OrderWithProducts) {

    try {

      const paymentSession = await firstValueFrom(
        this.client.send(
          'create.payment.session',
          {
            orderId: order.id,
            currency: 'usd',
            items: order.orderItem.map((orderItem) => ({
                  name: orderItem.name,
                  price: orderItem.price,
                  quantity: orderItem.quantity,
                })
            )

          }
        ),
      );

      return paymentSession;
      
    } catch ( err ) {
      throw new RpcException(err);
    }

  }

  async paidOrder( paidOrderDto: PaidOrderDto ) {
    try {
      const { orderId, stripePaymentId, receiptUrl } = paidOrderDto;

      const order = await this.findOne( orderId );

      if (order.status === OrderStatus.PAID ) return order;

      const update = this.order.update({
        where: { id: orderId },
        data: { 
          status: OrderStatus.PAID,
          paid: true,
          paidAt: new Date(),
          stripeChargedId: stripePaymentId,

          // relations
          OrderReceipt: {
            create: {
              receiptUrl 
            }
          }
        },
      });

      return update;


    } catch (err) {
      throw new RpcException(err);
    }
  }
}
