const API_URL = 'https://sample-ak-deepankar.hypermode.app/graphql';
const API_TOKEN = 'Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjIxNjA5NzcsImlhdCI6MTczMDYyNDk3NywiaXNzIjoiaHlwZXJtb2RlLmNvbSIsInN1YiI6ImFway0wMTkyZjE0OS03YWZkLTc4NWYtYTFlNy1iMGJkNzVlN2JhZjYifQ.B_Ahoca6dahbPdFCeWY-c0fu63N2k_7CwyrK_8tAsYOKNgZFWbGK4sQtS66dLmdStq4XrhixeRm4J0EF4UEzEg';

export const fetchGraphQL = async (query, variables = {}) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: API_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.errors ? result.errors[0]?.message : 'Unknown error');
    }

    return result.data;
  } catch (error) {
    console.error('Error during GraphQL fetch:', error);
    throw error;
  }
};
