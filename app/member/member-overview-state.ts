export type OptionalMemberData<Profile, Progression, Activity> = {
  ownerKey: string;
  profile: Profile | null;
  progression: Progression | null;
  activity: Activity | null;
  profileLoading: boolean;
  progressionLoading: boolean;
  activityLoading: boolean;
};

export function visibleOptionalMemberData<Profile, Progression, Activity>(
  accountKey: string,
  data: OptionalMemberData<Profile, Progression, Activity>,
): OptionalMemberData<Profile, Progression, Activity> {
  if (data.ownerKey === accountKey) return data;
  return {
    ownerKey: accountKey,
    profile: null,
    progression: null,
    activity: null,
    profileLoading: true,
    progressionLoading: true,
    activityLoading: true,
  };
}
