import {IsUUID , IsInt , Min} from 'class-validator'

export class RedeemItemDto {

  @IsUUID()
  rewardId!: string;


  @IsInt()
  @Min(1)
  quantity!: number;
}