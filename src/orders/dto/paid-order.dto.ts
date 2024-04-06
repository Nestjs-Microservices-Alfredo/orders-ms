import { IsNotEmpty, IsString, IsUUID } from "class-validator";


export class PaidOrderDto {

    @IsNotEmpty()
    @IsString()
    stripePaymentId: string;

    @IsNotEmpty()
    @IsUUID()
    orderId: string;

    @IsNotEmpty()
    @IsString()
    status: string;
    
    @IsNotEmpty()
    @IsString()
    receiptUrl: string;

}