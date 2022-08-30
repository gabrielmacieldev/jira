import { api } from './api';
import { dndOrderData, Issues, reorderIssues } from './apiTypes';

export const extendedApi = api.injectEndpoints({
  endpoints: (builder) => ({
    issues: builder.query<Issues, void>({
      query: () => 'project/1/issues',
      providesTags: ['Issues'],
    }),

    reorderIssues: builder.mutation<void, reorderIssues>({
      query: (body) => ({ url: 'issue/reorder', method: 'PUT', body }),
      invalidatesTags: ['Issues'],
      async onQueryStarted({ s, d }, { dispatch, queryFulfilled }) {
        const result = dispatch(
          extendedApi.util.updateQueryData('issues', undefined, (oldIssues) =>
            updateIssueOrderLocally(oldIssues, {
              s: { sId: s.sId, index: s.order - 1 },
              d: { dId: d.dId, index: d.newOrder - 1 },
            })
          )
        );
      },
    }),
  }),
  overrideExisting: false,
});

// hooks
export const { useIssuesQuery, useReorderIssuesMutation } = extendedApi;

// selectors
export const selectIssuesArray = (listId: number) =>
  extendedApi.useIssuesQuery(undefined, {
    selectFromResult: ({ data }) => ({
      issues: data ? data[listId] : [],
    }),
  });

// helpers
const updateIssueOrderLocally = (issues: Issues, { s, d }: dndOrderData) => {
  const source = issues[s.sId].slice(0);
  const target = issues[d.dId].slice(0);
  const draggedIssue = source.splice(s.index, 1)[0]; // remove dragged item from its source list
  (s.sId === d.dId ? source : target).splice(d.index, 0, draggedIssue); // insert dragged item into target list
  return { ...issues, [d.dId]: target, [s.sId]: source } as Issues;
};