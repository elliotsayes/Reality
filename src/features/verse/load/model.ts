import { VerseClient } from "../../../../verse/contract/verseClient"

export type VerseState = {
  info: Awaited<ReturnType<VerseClient['readInfo']>>,
  parameters: Awaited<ReturnType<VerseClient['readParameters']>>,
  entities: Awaited<ReturnType<VerseClient['readAllEntities']>>,
}
