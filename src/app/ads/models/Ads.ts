export interface CreateAdDto {
  title: string;
  description: string;
  price: number;
  imageUrl?: FileList | null;
  categoryId: number;
  location: string;
  subCategoryId: number;
  fieldValues: AdFieldValue[];
  DynamicFields?: IDynamicField[];
  DynamicFieldValues?: { [key: number]: SelectedValue | SelectedValue[] };
}

export interface SelectedValue {
  value: string;
  option?: Option;
  dynamicFieldId: number;
}

export interface AdFieldValue {
  dynamicFieldId: number;
  value?: string | null;
}

export interface IDynamicField {
  id: number;
  title: string;
  name: string;
  type: string;
  categoryId: number;
  categoryTitle: string;
  subCategoryId: number;
  subCategoryTitle?: any;
  shouldFilterbyParent: boolean;
  options: Option[];
}

export interface Option {
  id: number;
  label: string;
  value: string;
  parentValue?: string;
  dynamicFieldId: number;
}
