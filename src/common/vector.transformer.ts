import { ValueTransformer } from 'typeorm';

export const vectorTransformer: ValueTransformer = {
  // 저장할 때 number[]를 JSON 문자열로 변환 (DB의 pgvector 컬럼은 JSON 문자열이 아닌 실제 벡터 타입이어야 함)
  // 만약 DB에 실제 vector 타입으로 저장하려면, 직접 SQL로 컬럼 생성해두어야 합니다.
  to: (value: number[]): string => JSON.stringify(value),
  // 읽어올 때 JSON 문자열을 number[]로 변환
  from: (value: string): number[] => JSON.parse(value)
};
