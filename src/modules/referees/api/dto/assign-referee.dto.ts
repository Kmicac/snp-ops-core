import { IsString } from "class-validator";

export class AssignRefereeDto {
  @IsString()
  staffMemberId!: string;

  @IsString()
  role!: string; // "MAIN", "ASSISTANT", etc.
}
