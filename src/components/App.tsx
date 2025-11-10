@@ .. @@
         {phase === 'final-product' && (
          <>
            {/* DEBUG: Log what we're passing to FinalProductDisplay */}
            {console.log('🔍 DEBUG App.tsx - Passing to FinalProductDisplay:')}
            {console.log('  - values:', values)}
            {console.log('  - extendedValues:', extendedValues)}
            {console.log('  - additionalQuestionValues:', additionalQuestionValues)}
            {console.log('  - combined allAnswers:', { ...values, ...extendedValues, ...additionalQuestionValues })}
           <FinalProductDisplay
             productString={finalProductString}
             onBack={() => window.location.reload()}
             isLoading={isLoading}
            allAnswers={{
              ...values,
              ...extendedValues,
              ...additionalQuestionValues
            }}
            allAnswers={values} // Now all answers are stored in main values state
            allLabels={{
              ...labels,
              'RESULT_SELECTION': 'Select Your Configuration Option',
              'FINAL_SOLUTION_SELECTION': 'Choose Most Optimum Solenoid Solution'
            }}
           />
          </>
         )}