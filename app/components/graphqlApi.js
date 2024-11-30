const API_URL = 'https://sample-ak-deepankar.hypermode.app/graphql';
const API_TOKEN =  'Bearer ' + process.env.NEXT_PUBLIC_HYPERMODE_TOKEN;

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
