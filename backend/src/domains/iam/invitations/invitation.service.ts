
import { organizationService } from "../organizations/organization.service.js";

export const invitationService = {
  acceptInvitation: (
    token: string,
    name?: string,
    password?: string,
  ) => {
    return organizationService.acceptInvitation(token, password, name);
  },
};
