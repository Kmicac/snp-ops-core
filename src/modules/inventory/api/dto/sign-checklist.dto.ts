import { IsString } from "class-validator";

export class SignChecklistDto {
  @IsString()
  signedBy!: string;

  @IsString()
  signatureData!: string;
}
