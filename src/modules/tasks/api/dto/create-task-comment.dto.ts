import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateTaskCommentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  body!: string;
}
