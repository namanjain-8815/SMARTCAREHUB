declare module 'snarkjs' {
  export const groth16: {
    fullProve(
      input: Record<string, any>,
      wasmFile: string,
      zkeyFileName: string,
      logger?: any
    ): Promise<{
      proof: any;
      publicSignals: string[];
    }>;
    verify(
      vKey: any,
      publicSignals: string[],
      proof: any,
      logger?: any
    ): Promise<boolean>;
    exportSolidityCallData(
      proof: any,
      publicSignals: string[]
    ): Promise<string>;
  };
}
