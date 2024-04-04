import { Type } from "class-transformer";
import { IsNumber, IsPositive } from "class-validator";

export class CreateOrderDto {

    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    totalAmount: number;
    
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    totalItems: number;

}
