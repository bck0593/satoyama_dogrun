import { todayDateString } from "@/src/lib/date-utils";

export type DogSizeCategory = "small" | "medium" | "large";
export type DogGender = "male" | "female" | "unknown";

export type DogFormInput = {
  name: string;
  breed: string;
  breed_group: string;
  weight_kg: string;
  gender: DogGender;
  birth_date: string;
  size_category: DogSizeCategory;
  vaccine_expires_on: string;
  notes: string;
};

export const DOG_SIZE_OPTIONS: Array<{ value: DogSizeCategory; label: string }> = [
  { value: "small", label: "小型" },
  { value: "medium", label: "中型" },
  { value: "large", label: "大型" },
];

export const DOG_GENDER_OPTIONS: Array<{ value: DogGender; label: string }> = [
  { value: "unknown", label: "不明" },
  { value: "male", label: "オス" },
  { value: "female", label: "メス" },
];

export const INITIAL_DOG_FORM: DogFormInput = {
  name: "",
  breed: "",
  breed_group: "",
  weight_kg: "5",
  gender: "unknown",
  birth_date: "",
  size_category: "small",
  vaccine_expires_on: "",
  notes: "",
};

export function toDogCreatePayload(form: DogFormInput) {
  const today = todayDateString();
  const name = form.name.trim();
  const breed = form.breed.trim();
  const breedGroup = form.breed_group.trim();
  const notes = form.notes.trim();
  const weight = Number(form.weight_kg);

  if (!name || !breed) {
    throw new Error("名前と犬種を入力してください。");
  }

  if (!Number.isFinite(weight) || weight < 0.1) {
    throw new Error("体重は0.1kg以上で入力してください。");
  }

  if (!form.vaccine_expires_on) {
    throw new Error("ワクチン期限を入力してください。");
  }

  if (form.vaccine_expires_on < today) {
    throw new Error("ワクチン期限は今日以降を指定してください。");
  }

  if (form.birth_date && form.birth_date > today) {
    throw new Error("生年月日は今日以前を指定してください。");
  }

  return {
    name,
    breed,
    breed_group: breedGroup || undefined,
    weight_kg: weight,
    gender: form.gender,
    birth_date: form.birth_date || undefined,
    size_category: form.size_category,
    vaccine_expires_on: form.vaccine_expires_on,
    notes,
  };
}
