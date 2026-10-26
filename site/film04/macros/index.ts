import type { MacroDef } from "./kit"
import { macro as copyButton } from "./copy-button"
import { macro as asyncStatus } from "./async-status"
import { macro as confirmButton } from "./confirm-button"
import { macro as reactionButton } from "./reaction-button"
import { macro as notificationBell } from "./notification-bell"
import { macro as passwordInput } from "./password-input"
import { macro as otpInput } from "./otp-input"
import { macro as checklist } from "./checklist"
import { macro as stepper } from "./stepper"
import { macro as autoHeight } from "./auto-height"

export { MACRO_LENGTH, type MacroDef, type MacroProps } from "./kit"

/** The ten macros in film order (s2 plays them 1.5 s each; s3 lays them out as tiles). Each file under macros/ exports one `macro`. */
export const MACROS: MacroDef[] = [copyButton, asyncStatus, confirmButton, reactionButton, notificationBell, passwordInput, otpInput, checklist, stepper, autoHeight]
