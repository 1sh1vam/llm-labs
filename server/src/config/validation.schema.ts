import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  validateSync,
  IsOptional,
  ValidationError,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsNumber()
  @IsOptional()
  PORT: number;

  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsString()
  GROQ_API_KEY: string;

  @IsString()
  @IsOptional()
  DEFAULT_MODEL: string;

  @IsString()
  @IsOptional()
  FIREBASE_PROJECT_ID: string;

  @IsString()
  @IsOptional()
  FIREBASE_CLIENT_EMAIL: string;

  @IsString()
  @IsOptional()
  FIREBASE_PRIVATE_KEY: string;

  @IsString()
  @IsOptional()
  GOOGLE_APPLICATION_CREDENTIALS: string;

  @IsNumber()
  @IsOptional()
  MAX_PARAMETER_COMBINATIONS: number;

  @IsNumber()
  @IsOptional()
  MAX_CONCURRENT_LLM_CALLS: number;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors: ValidationError[] = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
