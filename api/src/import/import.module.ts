import { Module } from "@nestjs/common";
import { ImportService } from "./import.service";
import { ImportController } from "./import.controller";
import { NotificationModule } from "../notification/notification.module";
import { EventsModule } from "../events/events.module";
import { CategorisationModule } from "../categorisation/categorisation.module";

@Module({
    imports: [
        CategorisationModule,
        EventsModule,   
        NotificationModule,
    ],
    controllers: [ImportController],
    providers: [ImportService],
})
export class ImportModule {}