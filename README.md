# H000015 ANT

HTML/browser preview of the Attention Network Test built with `psyflow-web`.
The trial structure, cue/flanker condition semantics, key mapping, and feedback logic are aligned to local `T000015-ant`; block/trial counts are shortened for preview.

## Layout

- `main.ts`: task orchestration
- `config/config.yaml`: declarative config
- `src/run_trial.ts`: trial logic
- `src/utils.ts`: block accuracy summary helper

## Run

From `e:\xhmhc\TaskBeacon\psyflow-web`:

```powershell
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:4173/?task=H000015-ant
```
