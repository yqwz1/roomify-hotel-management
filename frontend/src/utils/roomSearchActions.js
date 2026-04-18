import { ROLE_GUEST } from '../components/navigation/navConfig';

export const ROOM_SEARCH_CARD_ACTIONS = {
  default: [
    {
      id: 'book',
      labelKey: 'roomSearchPage.bookRoomCta',
      tone: 'primary',
    },
  ],
  guest: [
    {
      id: 'help',
      labelKey: 'navGetHelp',
      tone: 'secondary',
    },
    {
      id: 'contactFrontDesk',
      labelKey: 'roomSearchPage.contactFrontDeskCta',
      tone: 'primary',
    },
  ],
};

export const getRoomSearchCardActions = (primaryRole) =>
  primaryRole === ROLE_GUEST
    ? ROOM_SEARCH_CARD_ACTIONS.guest
    : ROOM_SEARCH_CARD_ACTIONS.default;
