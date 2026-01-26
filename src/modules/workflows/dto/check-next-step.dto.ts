import { ApiProperty } from '@nestjs/swagger';
import { UserCandidateDto } from './start-flow-check.dto';

export class CheckNextStepResponseDto {
    @ApiProperty()
    requiresManualSelection: boolean;

    @ApiProperty({ type: [UserCandidateDto] })
    candidates: UserCandidateDto[];

    @ApiProperty()
    nextStepId: number;

    @ApiProperty()
    nextStepName: string;

    @ApiProperty({ required: false })
    isFinal?: boolean;
}
