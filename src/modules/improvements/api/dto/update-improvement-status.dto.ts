import { IsEnum } from "class-validator";
import { ImprovementStatus } from "@prisma/client";

export class UpdateImprovementStatusDto {
  @IsEnum(ImprovementStatus)
  status!: ImprovementStatus;
}
