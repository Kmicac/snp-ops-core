import { IsDateString, IsString, Length } from "class-validator";

export class CreateShiftDto {
  @IsString() @Length(2, 120)
  name!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;
}
