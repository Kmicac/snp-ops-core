import { IsOptional, IsString, Length } from "class-validator";

export class AddEvidenceDto {
  @IsString() @Length(2, 40)
  type!: string; // "photo" | "note" | "doc" | ...

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsString()
  note?: string;
}
