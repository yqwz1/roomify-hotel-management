# Diff Details

Date : 2026-05-27 22:40:00

Directory c:\\Users\\Alwaj\\OneDrive\\المستندات\\GitHub\\roomify-hotel-management

Total : 61 files,  2252 codes, 17 comments, 305 blanks, all 2574 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [README.md](/README.md) | Markdown | -1 | 0 | 0 | -1 |
| [RUNNING.md](/RUNNING.md) | Markdown | -11 | 0 | -5 | -16 |
| [backend/src/main/java/com/roomify/backend/config/SecurityConfig.java](/backend/src/main/java/com/roomify/backend/config/SecurityConfig.java) | Java | 4 | 15 | 2 | 21 |
| [backend/src/main/java/com/roomify/backend/controller/GuestReservationController.java](/backend/src/main/java/com/roomify/backend/controller/GuestReservationController.java) | Java | 32 | 0 | 2 | 34 |
| [backend/src/main/java/com/roomify/backend/controller/PaymentController.java](/backend/src/main/java/com/roomify/backend/controller/PaymentController.java) | Java | 50 | 0 | 8 | 58 |
| [backend/src/main/java/com/roomify/backend/dto/GuestReservationSummaryDto.java](/backend/src/main/java/com/roomify/backend/dto/GuestReservationSummaryDto.java) | Java | 41 | 0 | 3 | 44 |
| [backend/src/main/java/com/roomify/backend/dto/MockPaymentRequest.java](/backend/src/main/java/com/roomify/backend/dto/MockPaymentRequest.java) | Java | 30 | 0 | 12 | 42 |
| [backend/src/main/java/com/roomify/backend/dto/MockRefundRequest.java](/backend/src/main/java/com/roomify/backend/dto/MockRefundRequest.java) | Java | 12 | 0 | 6 | 18 |
| [backend/src/main/java/com/roomify/backend/dto/PaymentResponse.java](/backend/src/main/java/com/roomify/backend/dto/PaymentResponse.java) | Java | 98 | 0 | 29 | 127 |
| [backend/src/main/java/com/roomify/backend/dto/ReservationResponse.java](/backend/src/main/java/com/roomify/backend/dto/ReservationResponse.java) | Java | 7 | 0 | 2 | 9 |
| [backend/src/main/java/com/roomify/backend/entity/Payment.java](/backend/src/main/java/com/roomify/backend/entity/Payment.java) | Java | 48 | 0 | 18 | 66 |
| [backend/src/main/java/com/roomify/backend/entity/PaymentMethod.java](/backend/src/main/java/com/roomify/backend/entity/PaymentMethod.java) | Java | 5 | 0 | 0 | 5 |
| [backend/src/main/java/com/roomify/backend/entity/PaymentStatus.java](/backend/src/main/java/com/roomify/backend/entity/PaymentStatus.java) | Java | 2 | 0 | 0 | 2 |
| [backend/src/main/java/com/roomify/backend/entity/Reservation.java](/backend/src/main/java/com/roomify/backend/entity/Reservation.java) | Java | 8 | 0 | 3 | 11 |
| [backend/src/main/java/com/roomify/backend/entity/ReservationStatus.java](/backend/src/main/java/com/roomify/backend/entity/ReservationStatus.java) | Java | 5 | 0 | 2 | 7 |
| [backend/src/main/java/com/roomify/backend/repository/PaymentRepository.java](/backend/src/main/java/com/roomify/backend/repository/PaymentRepository.java) | Java | 8 | 0 | 5 | 13 |
| [backend/src/main/java/com/roomify/backend/repository/ReservationRepository.java](/backend/src/main/java/com/roomify/backend/repository/ReservationRepository.java) | Java | 21 | 0 | 3 | 24 |
| [backend/src/main/java/com/roomify/backend/search/AvailabilityQueryStrategy.java](/backend/src/main/java/com/roomify/backend/search/AvailabilityQueryStrategy.java) | Java | 0 | 1 | 0 | 1 |
| [backend/src/main/java/com/roomify/backend/service/GuestReservationServiceImpl.java](/backend/src/main/java/com/roomify/backend/service/GuestReservationServiceImpl.java) | Java | 2 | 0 | 0 | 2 |
| [backend/src/main/java/com/roomify/backend/service/PaymentService.java](/backend/src/main/java/com/roomify/backend/service/PaymentService.java) | Java | 222 | 0 | 26 | 248 |
| [backend/src/main/java/com/roomify/backend/service/ReservationFinancialService.java](/backend/src/main/java/com/roomify/backend/service/ReservationFinancialService.java) | Java | 6 | 0 | 1 | 7 |
| [backend/src/main/java/com/roomify/backend/service/ReservationService.java](/backend/src/main/java/com/roomify/backend/service/ReservationService.java) | Java | 19 | 0 | 3 | 22 |
| [backend/src/main/java/com/roomify/backend/service/ReservationStatusTransitionService.java](/backend/src/main/java/com/roomify/backend/service/ReservationStatusTransitionService.java) | Java | 1 | 0 | 0 | 1 |
| [backend/src/main/java/com/roomify/backend/service/RoomSearchService.java](/backend/src/main/java/com/roomify/backend/service/RoomSearchService.java) | Java | 2 | 0 | 0 | 2 |
| [backend/src/main/java/com/roomify/backend/service/RoomService.java](/backend/src/main/java/com/roomify/backend/service/RoomService.java) | Java | 1 | 0 | 0 | 1 |
| [backend/src/main/resources/db/migration/V26\_\_mock\_payment\_gateway\_metadata.sql](/backend/src/main/resources/db/migration/V26__mock_payment_gateway_metadata.sql) | MS SQL | 17 | 0 | 3 | 20 |
| [backend/src/main/resources/db/migration/V27\_\_align\_notification\_event\_type\_check.sql](/backend/src/main/resources/db/migration/V27__align_notification_event_type_check.sql) | MS SQL | 18 | 0 | 2 | 20 |
| [backend/src/main/resources/db/migration/V28\_\_align\_reservation\_status\_check.sql](/backend/src/main/resources/db/migration/V28__align_reservation_status_check.sql) | MS SQL | 14 | 0 | 2 | 16 |
| [backend/src/test/java/com/roomify/backend/integration/RoomSearchIntegrationTest.java](/backend/src/test/java/com/roomify/backend/integration/RoomSearchIntegrationTest.java) | Java | 82 | 0 | 16 | 98 |
| [backend/src/test/java/com/roomify/backend/service/PaymentServiceTest.java](/backend/src/test/java/com/roomify/backend/service/PaymentServiceTest.java) | Java | 162 | 0 | 25 | 187 |
| [frontend/index.html](/frontend/index.html) | HTML | 12 | 0 | 0 | 12 |
| [frontend/public/manifest.webmanifest](/frontend/public/manifest.webmanifest) | JSON | 26 | 0 | 1 | 27 |
| [frontend/public/sw.js](/frontend/public/sw.js) | JavaScript | 46 | 0 | 9 | 55 |
| [frontend/src/App.jsx](/frontend/src/App.jsx) | JavaScript JSX | 11 | 0 | 1 | 12 |
| [frontend/src/components/Sidebar.jsx](/frontend/src/components/Sidebar.jsx) | JavaScript JSX | 11 | 0 | 0 | 11 |
| [frontend/src/components/common/ModalFrame.jsx](/frontend/src/components/common/ModalFrame.jsx) | JavaScript JSX | 4 | 0 | 0 | 4 |
| [frontend/src/components/navigation/navConfig.js](/frontend/src/components/navigation/navConfig.js) | JavaScript | 14 | 0 | 0 | 14 |
| [frontend/src/components/navigation/navConfig.test.js](/frontend/src/components/navigation/navConfig.test.js) | JavaScript | 6 | 0 | 1 | 7 |
| [frontend/src/components/shell/AppShell.jsx](/frontend/src/components/shell/AppShell.jsx) | JavaScript JSX | 6 | 0 | 0 | 6 |
| [frontend/src/components/shell/AppShell.test.jsx](/frontend/src/components/shell/AppShell.test.jsx) | JavaScript JSX | 52 | 0 | 13 | 65 |
| [frontend/src/components/shell/AppTopbar.jsx](/frontend/src/components/shell/AppTopbar.jsx) | JavaScript JSX | 9 | 0 | 0 | 9 |
| [frontend/src/components/shell/AppTopbar.test.jsx](/frontend/src/components/shell/AppTopbar.test.jsx) | JavaScript JSX | 64 | 0 | 13 | 77 |
| [frontend/src/components/shell/MobileBottomNav.jsx](/frontend/src/components/shell/MobileBottomNav.jsx) | JavaScript JSX | 91 | 0 | 7 | 98 |
| [frontend/src/domain/reservations/statusRules.js](/frontend/src/domain/reservations/statusRules.js) | JavaScript | 3 | 0 | 0 | 3 |
| [frontend/src/hooks/useMediaQuery.js](/frontend/src/hooks/useMediaQuery.js) | JavaScript | 24 | 0 | 9 | 33 |
| [frontend/src/index.css](/frontend/src/index.css) | PostCSS | 39 | 0 | 6 | 45 |
| [frontend/src/main.jsx](/frontend/src/main.jsx) | JavaScript JSX | 2 | 0 | 1 | 3 |
| [frontend/src/pages/BookRoom.jsx](/frontend/src/pages/BookRoom.jsx) | JavaScript JSX | 11 | 0 | 1 | 12 |
| [frontend/src/pages/CancelReservation.jsx](/frontend/src/pages/CancelReservation.jsx) | JavaScript JSX | 1 | 0 | 0 | 1 |
| [frontend/src/pages/DemoPaymentGateway.jsx](/frontend/src/pages/DemoPaymentGateway.jsx) | JavaScript JSX | 257 | 0 | 19 | 276 |
| [frontend/src/pages/GuestDashboard.jsx](/frontend/src/pages/GuestDashboard.jsx) | JavaScript JSX | 20 | 0 | 1 | 21 |
| [frontend/src/pages/PaymentHistory.jsx](/frontend/src/pages/PaymentHistory.jsx) | JavaScript JSX | 194 | 0 | 13 | 207 |
| [frontend/src/pages/RoomDetails.jsx](/frontend/src/pages/RoomDetails.jsx) | JavaScript JSX | 3 | 0 | 0 | 3 |
| [frontend/src/pages/RoomSearch.jsx](/frontend/src/pages/RoomSearch.jsx) | JavaScript JSX | 6 | 0 | 0 | 6 |
| [frontend/src/pages/RoomSearch.test.jsx](/frontend/src/pages/RoomSearch.test.jsx) | JavaScript JSX | 20 | 0 | 3 | 23 |
| [frontend/src/pages/RoomTypes.jsx](/frontend/src/pages/RoomTypes.jsx) | JavaScript JSX | 72 | 0 | 3 | 75 |
| [frontend/src/pages/RoomsManagement.jsx](/frontend/src/pages/RoomsManagement.jsx) | JavaScript JSX | 113 | 0 | 4 | 117 |
| [frontend/src/pages/Staff.jsx](/frontend/src/pages/Staff.jsx) | JavaScript JSX | 106 | 0 | 6 | 112 |
| [frontend/src/registerServiceWorker.js](/frontend/src/registerServiceWorker.js) | JavaScript | 9 | 1 | 2 | 12 |
| [frontend/src/services/paymentService.js](/frontend/src/services/paymentService.js) | JavaScript | 21 | 0 | 5 | 26 |
| [start-roomify-windows.ps1](/start-roomify-windows.ps1) | PowerShell | 94 | 0 | 19 | 113 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details