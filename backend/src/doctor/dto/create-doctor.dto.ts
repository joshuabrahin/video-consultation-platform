import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  specialization!: string

  @IsEmail()
  calendarEmail!: string

  @IsUUID()
  hospitalId!: string
}
