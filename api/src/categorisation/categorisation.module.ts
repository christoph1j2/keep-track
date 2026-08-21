import { Module } from "@nestjs/common";
import { HeuristicMatcherService } from "./heuristic-matcher.service";
import { OpenRouterProvider } from "./providers/openrouter.provider";
import { LLM_PROVIDER } from "./providers/llm-provider.interface";
import { CategorisationService } from "./categorisation.service";

@Module({
    providers: [
        CategorisationService,
        HeuristicMatcherService,
        // Provide LLM provider using `useClass` implementation.
        { provide: LLM_PROVIDER, useClass: OpenRouterProvider },
    ],
    exports: [CategorisationService],
})
export class CategorisationModule {}