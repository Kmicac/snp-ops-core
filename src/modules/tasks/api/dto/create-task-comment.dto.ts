import { IsOptional, IsString, Length } from "class-validator";

export class CreateTaskCommentDto {
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  message?: string;

  // Campo legacy para compatibilidad hacia atrás.
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  body?: string;
}
