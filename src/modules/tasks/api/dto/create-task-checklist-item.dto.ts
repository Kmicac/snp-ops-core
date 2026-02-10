import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateTaskChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  text!: string;
}
