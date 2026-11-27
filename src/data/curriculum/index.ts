import type { Lesson } from '../courses'
import { beginnerCurriculum } from './beginnerCourses'
import { intermediateCurriculum } from './intermediateCourses'
import { advancedCurriculum } from './advancedCourses'

export const fullCyberCurriculum: Record<string, Lesson[]> = {
  ...beginnerCurriculum,
  ...intermediateCurriculum,
  ...advancedCurriculum,
}
