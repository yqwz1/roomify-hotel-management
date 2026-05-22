import { ROLE_GUEST } from '../components/navigation/navConfig';

export const ROOM_SEARCH_CARD_ACTIONS = {
  default: [
    {
      id: 'details',
      labelKey: 'roomSearchPage.viewDetailsCta',
      tone: 'secondary',
    },
    {
      id: 'book',
      labelKey: 'roomSearchPage.bookRoomCta',
      tone: 'primary',
    },
  ],
  guest: [
    {
      id: 'details',
      labelKey: 'roomSearchPage.viewDetailsCta',
      tone: 'secondary',
    },
    {
      id: 'book',
      labelKey: 'roomSearchPage.bookRoomCta',
      tone: 'primary',
    },
    {
      id: 'contactFrontDesk',
      labelKey: 'roomSearchPage.contactFrontDeskCta',
      tone: 'secondary',
    },
  ],
};

export const getRoomSearchCardActions = (primaryRole) =>
  primaryRole === ROLE_GUEST
    ? ROOM_SEARCH_CARD_ACTIONS.guest
    : ROOM_SEARCH_CARD_ACTIONS.default;
