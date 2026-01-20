import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ZonesModule } from './modules/zones/zones.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PrioritiesModule } from './modules/priorities/priorities.module';
import { PositionsModule } from './modules/positions/positions.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { RegionsModule } from './modules/regions/regions.module';
import { SubcategoriasModule } from './modules/subcategories/subcategorias.module';
import { ReglasMapeoModule } from './modules/rules/reglas-mapeo.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    PermissionsModule,
    UsersModule,
    RolesModule,
    ZonesModule,
    CategoriesModule,
    CompaniesModule,
    DepartmentsModule,
    PrioritiesModule,
    PositionsModule,
    ProfilesModule,
    RegionsModule,
    SubcategoriasModule,
    ReglasMapeoModule,
    ReportsModule,
    TicketsModule,
    WorkflowsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
