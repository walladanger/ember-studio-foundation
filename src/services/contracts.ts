export interface PersistenceAdapter<T> {
  read(): Promise<T | null>;
  write(value: T): Promise<void>;
  clear(): Promise<void>;
}
