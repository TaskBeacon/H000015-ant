import {
  set_trial_context,
  type StimBank,
  type TaskSettings,
  type TrialBuilder,
  type TrialSnapshot
} from "psyflow-web";

function resolveCueCode(cueType: string): number {
  const mapping: Record<string, number> = {
    no_cue: 1,
    center_cue: 2,
    double_cue: 3,
    spatial_cue_up: 4,
    spatial_cue_down: 4
  };
  return mapping[cueType] ?? 1;
}

function resolveFeedbackLabel(
  snapshot: TrialSnapshot
): "correct_feedback" | "incorrect_feedback" | "no_response_feedback" {
  const response = snapshot.units.stimulus?.response;
  const hit = snapshot.units.stimulus?.hit;
  if (response && hit === true) {
    return "correct_feedback";
  }
  if (response && hit === false) {
    return "incorrect_feedback";
  }
  return "no_response_feedback";
}

export function run_trial(
  trial: TrialBuilder,
  condition: string,
  context: {
    settings: TaskSettings;
    stimBank: StimBank;
    block_id: string;
    block_idx: number;
  }
): TrialBuilder {
  const { settings, stimBank, block_id, block_idx } = context;
  const condition_id = String(condition);
  const parts = condition_id.split("_");
  const target_direction = String(parts[parts.length - 1] ?? "left");
  const target_position = String(parts[parts.length - 2] ?? "up");
  const flanker_type = String(parts[parts.length - 3] ?? "congruent");
  const cue_type = String(parts.slice(0, -3).join("_") || "no_cue");
  const key_list = ((settings.key_list as string[]) ?? ["f", "j"]).map(String);
  const left_key = String(settings.left_key ?? "f");
  const right_key = String(settings.right_key ?? "j");
  const correct_response = target_direction === "left" ? left_key : right_key;
  const stim_name = `${flanker_type}_${target_position}_${target_direction}`;
  const trigger_map = (settings.triggers ?? {}) as Record<string, unknown>;

  const fixationUnit = trial.unit("fixation").addStim(stimBank.get("fixation"));
  set_trial_context(fixationUnit, {
    trial_id: trial.trial_id,
    phase: "pre_cue_fixation",
    deadline_s: Number(settings.fixation_duration ?? 0.5),
    valid_keys: [...key_list],
    block_id,
    condition_id,
    task_factors: {
      condition: condition_id,
      stage: "pre_cue_fixation",
      block_idx
    },
    stim_id: "fixation"
  });
  fixationUnit.show({ duration: Number(settings.fixation_duration ?? 0.5) }).to_dict();

  if (cue_type !== "no_cue") {
    const cueUnit = trial.unit("cue");
    if (cue_type === "center_cue") {
      cueUnit.addStim(stimBank.get("cue_center"));
    } else if (cue_type === "double_cue") {
      cueUnit.addStim(stimBank.get("cue_up")).addStim(stimBank.get("cue_down"));
    } else if (cue_type === "spatial_cue_up" || cue_type === "spatial_cue_down") {
      cueUnit.addStim(stimBank.get(cue_type === "spatial_cue_up" ? "cue_up" : "cue_down"));
    }
    set_trial_context(cueUnit, {
      trial_id: trial.trial_id,
      phase: "cue_signal",
      deadline_s: Number(settings.cue_duration ?? 0.1),
      valid_keys: [...key_list],
      block_id,
      condition_id,
      task_factors: {
        condition: condition_id,
        stage: "cue_signal",
        cue_type,
        block_idx
      },
      stim_id: cue_type
    });
    cueUnit.show({ duration: Number(settings.cue_duration ?? 0.1) }).to_dict();
  }

  const stimulusUnit = trial.unit("stimulus").addStim(stimBank.get(stim_name));
  const cue_code = resolveCueCode(cue_type);
  const flanker_code = flanker_type === "congruent" ? 1 : 2;
  const pos_code = target_position === "up" ? 1 : 2;
  const dir_code = target_direction === "left" ? 1 : 2;
  const stim_trigger = Number(trigger_map[`stim_${cue_code}${flanker_code}${pos_code}${dir_code}`] ?? 0);
  set_trial_context(stimulusUnit, {
    trial_id: trial.trial_id,
    phase: "flanker_response",
    deadline_s: Number(settings.stim_duration ?? 1),
    valid_keys: [...key_list],
    block_id,
    condition_id,
    task_factors: {
      condition: condition_id,
      stage: "flanker_response",
      cue_type,
      flanker_type,
      target_position,
      target_direction,
      block_idx,
      stim_trigger
    },
    stim_id: stim_name
  });
  stimulusUnit
    .captureResponse({
      keys: key_list,
      correct_keys: [correct_response],
      duration: Number(settings.stim_duration ?? 1),
      response_trigger: {
        [left_key]: Number(trigger_map.left_key_press ?? 201),
        [right_key]: Number(trigger_map.right_key_press ?? 202)
      },
      terminate_on_response: true
    })
    .to_dict();

  const feedbackUnit = trial
    .unit("feedback")
    .addStim((snapshot: TrialSnapshot) => stimBank.get(resolveFeedbackLabel(snapshot)));
  set_trial_context(feedbackUnit, {
    trial_id: trial.trial_id,
    phase: "feedback",
    deadline_s: Number(settings.feedback_duration ?? 0.5),
    valid_keys: [...key_list],
    block_id,
    condition_id,
    task_factors: {
      condition: condition_id,
      stage: "feedback",
      block_idx
    }
  });
  feedbackUnit.show({ duration: Number(settings.feedback_duration ?? 0.5) }).to_dict();

  const itiUnit = trial.unit("iti");
  set_trial_context(itiUnit, {
    trial_id: trial.trial_id,
    phase: "inter_trial_interval",
    deadline_s: (settings.iti_duration as number | number[] | null | undefined) ?? null,
    valid_keys: [...key_list],
    block_id,
    condition_id,
    task_factors: {
      condition: condition_id,
      stage: "inter_trial_interval",
      block_idx
    }
  });
  itiUnit.show({ duration: (settings.iti_duration as number | number[] | null | undefined) ?? null }).to_dict();

  return trial;
}
