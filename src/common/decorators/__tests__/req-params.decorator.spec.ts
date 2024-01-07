// FILEPATH: /Users/theone/Programme/my-project/knowledge-base-server/src/common/decorators/__tests__/req-params.decorator.spec.ts
import { ExecutionContext } from '@nestjs/common';
import { createMock } from '@golevelup/ts-jest';
import { AllResParams } from '../req-params.decorator';

describe('AllResParams decorator', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    mockRequest = {
      query: { key: 'value' },
      body: { key: 'value' },
      params: { key: 'value' },
    };

    mockExecutionContext = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    });
  });

  it('should return all request parameters', () => {
    const decorator = AllResParams(null, mockExecutionContext);
    expect(decorator).toEqual({
      query: mockRequest.query,
      body: mockRequest.body,
      params: mockRequest.params,
    });
  });
});
