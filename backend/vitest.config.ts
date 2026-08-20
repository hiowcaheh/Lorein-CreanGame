import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /*
     * Testy integracyjne dziela JEDNA baze i kazdy z nich zaklada w niej
     * schemat od zera. Przy domyslnym ustawieniu vitest uruchamia pliki
     * rownolegle, wiec jeden kasowal tabele w chwili, gdy drugi z nich
     * korzystal — stad bledy w rodzaju "relation user_data does not exist"
     * albo "duplicate key value violates unique constraint pg_type...".
     *
     * Caly zestaw idzie w ~3 sekundy, wiec szeregowe uruchamianie plikow
     * nic nie kosztuje, a usuwa cala klase falszywych bledow.
     */
    fileParallelism: false,
  },
});
