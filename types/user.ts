import { User } from "firebase/auth"

export interface AppUser extends User {
  fullName?: string
}
