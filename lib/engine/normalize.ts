import { DesignSpec } from "../spec";

const normalizeText = (value: string): string => value.trim();

export const normalizeDesignSpec = (designSpec: DesignSpec): DesignSpec => {
  const normalized = structuredClone(designSpec);

  normalized.projectName = normalizeText(normalized.projectName);
  normalized.basics.description = normalizeText(normalized.basics.description);
  normalized.stack.framework = normalizeText(normalized.stack.framework);
  normalized.stack.languageVersion = normalizeText(
    normalized.stack.languageVersion,
  );
  normalized.github.branches.default = normalizeText(
    normalized.github.branches.default,
  );

  normalized.github.topics = [...normalized.github.topics]
    .map((topic) => normalizeText(topic))
    .filter(Boolean)
    .sort();
  normalized.github.environments = [...normalized.github.environments]
    .map((env) => normalizeText(env))
    .filter(Boolean)
    .sort();
  normalized.github.secrets = [...normalized.github.secrets]
    .map((secret) => normalizeText(secret))
    .filter(Boolean)
    .sort();
  normalized.github.webhooks = [...normalized.github.webhooks]
    .map((hook) => ({
      ...hook,
      id: normalizeText(hook.id),
      url: normalizeText(hook.url),
      events: [...hook.events].sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return normalized;
};
