import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsNumber,
  Min,
  Max,
  IsOptional,
  ValidateNested,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ParameterRangesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(2, { each: true })
  temperatures: number[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(1, { each: true })
  topP: number[];
}

export class CreateExperimentDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  prompt: string;

  @ValidateNested()
  @Type(() => ParameterRangesDto)
  parameterRanges: ParameterRangesDto;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
