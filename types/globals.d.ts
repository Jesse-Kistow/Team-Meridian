   export {};

   declare global {
     interface CustomJwtSessionClaims {
       metadata: {
         onboardingComplete?: boolean;
         role?: "ATTENDEE" | "ORGANIZER";
       };
     }
   }