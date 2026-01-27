import { IsString } from "class-validator";

export class AddAttendeeDto {
  @IsString()
  staffMemberId!: string;
}
