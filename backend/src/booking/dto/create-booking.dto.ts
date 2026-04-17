import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  MinLength,
  ValidateNested,
  IsOptional,
} from 'class-validator'
import { Type } from 'class-transformer'

class DoctorRefDto {
  @IsUUID()
  id!: string

  @IsEmail()
  @IsOptional()
  calendarEmail?: string
}

class PatientInfoDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(5)
  problem!: string

  @IsString()
  @IsOptional()
  prescription?: string
}

export class VideoConsultationDto {
  @ValidateNested()
  @Type(() => DoctorRefDto)
  doctor!: DoctorRefDto

  @ValidateNested()
  @Type(() => PatientInfoDto)
  patient!: PatientInfoDto

  @IsDateString()
  start!: string
}
