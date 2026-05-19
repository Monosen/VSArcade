// VSArcade — Host-side game descriptor

export interface IGameDescriptor {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly webviewEntry: string;
}
