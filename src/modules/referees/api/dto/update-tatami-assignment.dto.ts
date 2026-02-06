import { IsNotEmpty, IsString } from "class-validator";

export class UpdateTatamiAssignmentDto {
  @IsString()
  @IsNotEmpty()
  role!: string;
}
